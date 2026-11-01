require "digest"

class ApplicationController < ActionController::API
  private

  attr_reader :current_user, :current_session

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
