require "test_helper"

class CorsTest < ActionDispatch::IntegrationTest
  test "preflight allows the configured frontend and bearer authorization header" do
    options "/transactions", headers: {
      "Origin" => ENV.fetch("FRONTEND_URL"),
      "Access-Control-Request-Method" => "POST",
      "Access-Control-Request-Headers" => "authorization,content-type"
    }
    assert_response :success
    assert_equal ENV.fetch("FRONTEND_URL"), response.headers["Access-Control-Allow-Origin"]
    assert_includes response.headers["Access-Control-Allow-Headers"].downcase, "authorization"
  end

  test "an unrelated origin is not allowed" do
    options "/transactions", headers: {
      "Origin" => "https://untrusted.example.test",
      "Access-Control-Request-Method" => "POST"
    }
    assert_nil response.headers["Access-Control-Allow-Origin"]
  end
end
