class TransfersController < ApplicationController
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
    scope = current_user.transfers.where(date: start_date..end_date)
    if params[:wallet_id].present?
      scope = scope.where(source_wallet_id: params[:wallet_id]).or(scope.where(destination_wallet_id: params[:wallet_id]))
    end
    page = [ params[:page].to_i, 1 ].max
    count = scope.count
    render json: { transfers: scope.order(date: :desc, id: :desc).limit(10).offset((page - 1) * 10).map { |item| transfer_json(item) },
      pagination: { page: page, total_count: count, total_pages: (count / 10.0).ceil } }
  end

  def show
    render json: transfer_json(current_user.transfers.find(params[:id]))
  end

  def create
    transfer = current_user.transfers.new(params.require(:transfer).permit(:source_wallet_id, :destination_wallet_id, :amount, :fee, :date, :description))
    if WalletTransfer.call(current_user, transfer)
      render json: transfer_json(transfer), status: :created
    else
      render json: { errors: transfer.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    transfer = current_user.transfers.find(params[:id])
    if WalletTransfer.call(current_user, transfer, destroy: true)
      head :no_content
    else
      render json: { errors: transfer.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def transfer_json(transfer)
    transfer.as_json(only: [ :id, :source_wallet_id, :destination_wallet_id, :amount, :fee, :date, :description ])
  end
end
