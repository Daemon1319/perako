class SummariesController < ApplicationController
  before_action :authenticate_user!

  def show
    transactions = current_user.transactions
    month = nil

    unless params[:period] == "all"
      begin
        month = if params[:month].present?
          Date.iso8601("#{params[:month]}-01")
        else
          Date.current.beginning_of_month
        end
      rescue Date::Error
        return render json: { error: "Month must use YYYY-MM" }, status: :bad_request
      end

      transactions = transactions.between_dates(month.beginning_of_month, month.end_of_month)
    end

    totals = transactions.group(:transaction_type).sum(:amount)
    income = totals.fetch("income", 0).to_d
    expenses = totals.fetch("expense", 0).to_d

    render json: {
      month: month&.strftime("%Y-%m"),
      period: month ? "month" : "all",
      income: income.to_s("F"),
      expenses: expenses.to_s("F"),
      net_income: (income - expenses).to_s("F"),
      expense_categories: expense_categories(transactions)
    }
  end

  private

  def expense_categories(transactions)
    amounts = transactions.by_type("expense").group(:category_id).sum(:amount)
    names = current_user.categories.where(id: amounts.keys.compact).pluck(:id, :name).to_h
    amounts.map do |category_id, amount|
      { category_id: category_id, name: names.fetch(category_id, "Uncategorized"), amount: amount.to_s("F") }
    end.sort_by { |category| [ -category[:amount].to_d, category[:name], category[:category_id].to_i ] }
  end
end
