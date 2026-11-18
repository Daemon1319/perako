require "digest"

class ApplicationController < ActionController::API
  rate_limit to: 300, within: 1.minute, name: "reads", scope: "api",
    if: -> { request.get? || request.head? },
    with: -> { render_rate_limit_error(60) }
  rate_limit to: 60, within: 1.minute, name: "writes", scope: "api",
    unless: -> { request.get? || request.head? || request.options? },
    with: -> { render_rate_limit_error(60) }
  private

  attr_reader :current_user, :current_session

  def render_rate_limit_error(retry_after, message = "Too many requests. Try again shortly.")
    response.set_header("Retry-After", retry_after.to_s)
    render json: { error: message }, status: :too_many_requests
  end

  def authenticate_user!
    scheme, token = request.authorization.to_s.split(" ", 2)

    if scheme&.casecmp?("Bearer") && token.present?
      @current_session = Session
        .where("expires_at > ?", Time.current)
        .find_by(token_digest: Digest::SHA256.hexdigest(token))
    end

    unless current_session
      return render json: { error: "Please log in" },
                    status: :unauthorized
    end

    @current_user = current_session.user
  end
end
