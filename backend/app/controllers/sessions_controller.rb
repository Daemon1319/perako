require "digest"

class SessionsController < ApplicationController
  before_action :authenticate_user!, only: [ :destroy ]
  rate_limit to: 10, within: 3.minutes, only: :create,
    with: -> { render json: { error: "Too many login attempts. Try again later." }, status: :too_many_requests }

  def create
    credentials = params.require(:session).permit(:email, :password, :remember_me)

    user = User.authenticate_by(email: credentials[:email], password: credentials[:password])

    unless user
      render json: { error: "Invalid email or password" }, status: :unauthorized
      return
    end

    token = SecureRandom.hex(32)

    session = user.sessions.create!(
      token_digest: Digest::SHA256.hexdigest(token),
      expires_at: (ActiveModel::Type::Boolean.new.cast(credentials[:remember_me]) ? 30.days : 7.days).from_now
    )

    render json: { token: token, expires_at: session.expires_at, user: user.as_json(only: [ :id, :name, :email ]) }, status: :created
  end

  def destroy
    current_session.destroy!
    head :no_content
  end
end
