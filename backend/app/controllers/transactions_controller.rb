class TransactionsController < ApplicationController
  before_action :authenticate_user!

  def index
    begin
      start_date = Date.iso8601(params[:start_date]) if params[:start_date].present?
      end_date = Date.iso8601(params[:end_date]) if params[:end_date].present?
    rescue Date::Error, TypeError
      return render json: { error: "Dates must use YYYY-MM-DD" }, status: :bad_request
    end

    if start_date && end_date && start_date > end_date
      return render json: { error: "Start date must not be after end date" }, status: :bad_request
    end

    transactions = current_user.transactions
      .by_type(params[:transaction_type])
      .by_category(params[:category_id])
      .between_dates(start_date, end_date)
      .order(date: :desc, id: :desc)

    page = [ params[:page].to_i, 1 ].max
    per_page = 10
    total_count = transactions.count

    transactions = transactions
      .limit(per_page)
      .offset((page - 1) * per_page)

    render json: {
      transactions: transactions.as_json(
        only: [ :id, :amount, :date, :description, :transaction_type, :category_id ]),
      pagination: {
        page: page,
        per_page: per_page,
        total_count: total_count,
        total_pages: (total_count.to_f / per_page).ceil
      }
    }
  end

  def create
    transaction = current_user.transactions.new(transaction_params)

    if transaction.save
      render json: transaction.as_json(only: [ :id, :amount, :date, :description, :transaction_type, :category_id ]), status: :created
    else
      render json: { errors: transaction.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    transaction = current_user.transactions.find(params[:id])

    if transaction.update(transaction_params)
      render json: transaction.as_json(only: [ :id, :amount, :date, :description, :transaction_type, :category_id ])
    else
      render json: { errors: transaction.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    transaction = current_user.transactions.find(params[:id])

    transaction.destroy!
    head :no_content
  end

  private

  def transaction_params
    params.require(:transaction).permit(:amount, :date, :description, :transaction_type, :category_id)
  end
end
