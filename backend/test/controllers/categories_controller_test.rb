require "test_helper"

class CategoriesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @headers = { "Authorization" => "Bearer first-user-test-token" }
  end

  test "owners can rename a category but cannot change its type" do
    category = categories(:one)
    patch "/categories/#{category.id}", params: { category: { name: "Meals", transaction_type: "income" } }, headers: @headers, as: :json
    assert_response :ok
    assert_equal "Meals", category.reload.name
    assert_equal "expense", category.transaction_type
  end

  test "deleting an owned category preserves its transactions" do
    category = categories(:one)
    transaction = transactions(:one)
    delete "/categories/#{category.id}", headers: @headers, as: :json
    assert_response :no_content
    assert_not Category.exists?(category.id)
    assert_nil transaction.reload.category_id
  end

  test "another users categories cannot be renamed or deleted" do
    category = categories(:two)
    patch "/categories/#{category.id}", params: { category: { name: "Changed" } }, headers: @headers, as: :json
    assert_response :not_found
    assert_equal "Transport", category.reload.name
    delete "/categories/#{category.id}", headers: @headers, as: :json
    assert_response :not_found
    assert Category.exists?(category.id)
  end
end
