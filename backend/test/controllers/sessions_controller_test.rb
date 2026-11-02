require "test_helper"

class SessionsControllerTest < ActionDispatch::IntegrationTest
  test "login returns a token whose digest is stored and logout revokes it" do
    post "/login", params: { session: { email: "first@example.com", password: "LearningRails123!" } }, as: :json
    assert_response :created
    token = response.parsed_body.fetch("token")
    session = Session.find_by!(token_digest: Digest::SHA256.hexdigest(token))
    assert_equal users(:one).id, session.user_id
    assert_not_equal token, session.token_digest

    headers = { "Authorization" => "Bearer #{token}" }
    get "/me", headers: headers
    assert_response :ok
    assert_equal users(:one).id, response.parsed_body.fetch("id")
    assert_not response.parsed_body.key?("password_digest")

    delete "/logout", headers: headers, as: :json
    assert_response :no_content
    get "/me", headers: headers
    assert_response :unauthorized
  end

  test "remembered sessions last 30 days while other sessions last 7 days" do
    freeze_time do
      [ [ true, 30.days ], [ false, 7.days ], [ "false", 7.days ] ].each do |remember_me, lifetime|
        post "/login", params: { session: {
          email: "first@example.com", password: "LearningRails123!", remember_me: remember_me
        } }, as: :json
        assert_response :created
        token = response.parsed_body.fetch("token")
        session = Session.find_by!(token_digest: Digest::SHA256.hexdigest(token))
        assert_equal lifetime.from_now, session.expires_at
      end
    end
  end

  test "wrong passwords do not create sessions" do
    assert_no_difference "Session.count" do
      post "/login", params: { session: { email: "first@example.com", password: "wrong-password" } }, as: :json
    end
    assert_response :unauthorized
  end

  test "missing and expired tokens are rejected" do
    get "/me"
    assert_response :unauthorized
    sessions(:one).update!(expires_at: 1.minute.ago)
    get "/me", headers: { "Authorization" => "Bearer first-user-test-token" }
    assert_response :unauthorized
  end
end
