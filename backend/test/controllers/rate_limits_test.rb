require "test_helper"

class RateLimitsTest < ActionDispatch::IntegrationTest
  test "repeated login attempts are throttled and recover after the window" do
    10.times do
      post "/login", params: { session: { email: "first@example.com", password: "wrong-password" } }, as: :json
      assert_response :unauthorized
    end

    post "/login", params: { session: { email: "first@example.com", password: "wrong-password" } }, as: :json
    assert_response :too_many_requests
    assert response.headers["Retry-After"].present?

    travel 4.minutes do
      post "/login", params: { session: { email: "first@example.com", password: "LearningRails123!" } }, as: :json
      assert_response :created
    end
  end

  test "repeated signup attempts are throttled" do
    10.times do
      post "/users", params: { user: { name: "Duplicate", email: "first@example.com", password: "LearningRails123!" } }, as: :json
      assert_response :unprocessable_entity
    end

    post "/users", params: { user: { name: "Duplicate", email: "first@example.com", password: "LearningRails123!" } }, as: :json
    assert_response :too_many_requests
    assert response.headers["Retry-After"].present?
  end

  test "read limit is shared across controllers, isolates IPs, and expires" do
    headers = { "REMOTE_ADDR" => "192.0.2.41" }
    Rails.cache.write("rate-limit:api:reads:192.0.2.41", 299, expires_in: 1.minute)

    get "/me", headers: headers
    assert_response :unauthorized
    get "/wallets", headers: headers
    assert_response :too_many_requests
    assert_equal "60", response.headers["Retry-After"]
    assert_equal "Too many requests. Try again shortly.", response.parsed_body.fetch("error")

    get "/me", headers: { "REMOTE_ADDR" => "192.0.2.42" }
    assert_response :unauthorized

    travel 61.seconds do
      get "/me", headers: headers
      assert_response :unauthorized
    end
  end

  test "write limit blocks mutations across controllers before authentication" do
    headers = { "REMOTE_ADDR" => "192.0.2.43" }
    Rails.cache.write("rate-limit:api:writes:192.0.2.43", 59, expires_in: 1.minute)

    post "/transactions", headers: headers, as: :json
    assert_response :unauthorized
    assert_no_difference "Wallet.count" do
      post "/wallets", headers: headers, params: { wallet: { name: "Blocked" } }, as: :json
    end
    assert_response :too_many_requests
    assert_equal "60", response.headers["Retry-After"]

    get "/me", headers: headers
    assert_response :unauthorized
    get "/up", headers: headers
    assert_response :ok
  end

  test "health checks remain available when the read limit is exhausted" do
    headers = { "REMOTE_ADDR" => "192.0.2.44" }
    Rails.cache.write("rate-limit:api:reads:192.0.2.44", 300, expires_in: 1.minute)

    get "/me", headers: headers
    assert_response :too_many_requests
    get "/up", headers: headers
    assert_response :ok
  end
end
