require "test_helper"

class UsersControllerTest < ActionDispatch::IntegrationTest
  test "signup normalizes email and returns only public fields" do
    post "/users", params: { user: { name: "New User", email: " NEW@example.com ", password: "LearningRails123!" } }, as: :json
    assert_response :created
    assert_equal %w[email id name], response.parsed_body.keys.sort
    assert_equal "new@example.com", response.parsed_body.fetch("email")
    assert User.find(response.parsed_body.fetch("id")).authenticate("LearningRails123!")
  end

  test "duplicate email is rejected without creating another account" do
    assert_no_difference "User.count" do
      post "/users", params: { user: { name: "Duplicate", email: "FIRST@example.com", password: "LearningRails123!" } }, as: :json
    end
    assert_response :unprocessable_entity
  end
end
