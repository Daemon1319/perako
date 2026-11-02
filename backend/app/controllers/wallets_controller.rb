class WalletsController < ApplicationController
  before_action :authenticate_user!

  def index
    render json: current_user.wallets.order(:name).map { |wallet| wallet_json(wallet) }
  end

  def create
    wallet = current_user.wallets.new(wallet_params)
    if wallet.save
      render json: wallet_json(wallet), status: :created
    else
      render json: { errors: wallet.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    wallet = current_user.wallets.find(params[:id])
    current_user.with_lock do
      if wallet.update(wallet_params)
        render json: wallet_json(wallet)
      else
        render json: { errors: wallet.errors.full_messages }, status: :unprocessable_entity
      end
    end
  end

  def destroy
    current_user.with_lock do
      wallet = current_user.wallets.find(params[:id])
      if wallet.destroy
        head :no_content
      else
        render json: { errors: wallet.errors.full_messages }, status: :unprocessable_entity
      end
    end
  end

  private

  def wallet_params
    params.require(:wallet).permit(:name)
  end

  def wallet_json(wallet)
    wallet.as_json(only: [ :id, :name ]).merge(balance: wallet.balance.to_s("F"))
  end
end
