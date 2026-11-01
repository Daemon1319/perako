class UsersController < ApplicationController
  before_action :authenticate_user!, only: [ :me ]
  rate_limit to: 10, within: 1.hour, only: :create,
    with: -> { render json: { error: "Too many signup attempts. Try again later." }, status: :too_many_requests }

  def create
    user = User.new(user_params)

    if user.save
      render json: user.as_json(only: [ :id, :name, :email ]), status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def me
    render json: current_user.as_json(only: [ :id, :name, :email ])
  end

  private

  def user_params
    params.require(:user).permit(:name, :email, :password, :password_confirmation)
  end
end
