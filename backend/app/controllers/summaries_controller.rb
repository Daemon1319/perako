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
      net_income: (income - expenses).to_s("F")
    }
  end
end
