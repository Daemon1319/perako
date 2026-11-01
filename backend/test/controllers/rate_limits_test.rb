require "test_helper"

class RateLimitsTest < ActionDispatch::IntegrationTest
  test "repeated login attempts are throttled and recover after the window" do
    10.times do
      post "/login", params: { session: { email: "first@example.com", password: "wrong-password" } }, as: :json
      assert_response :unauthorized
    end

    post "/login", params: { session: { email: "first@example.com", password: "wrong-password" } }, as: :json
    assert_response :too_many_requests

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
  end
end
