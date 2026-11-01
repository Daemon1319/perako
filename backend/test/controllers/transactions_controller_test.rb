require "test_helper"

class TransactionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @headers = { "Authorization" => "Bearer first-user-test-token" }
  end

  test "owners can update and delete their transactions" do
    transaction = transactions(:one)
    patch "/transactions/#{transaction.id}", params: { transaction: { amount: "175.00" } }, headers: @headers, as: :json
    assert_response :ok
    assert_equal BigDecimal("175"), transaction.reload.amount

    delete "/transactions/#{transaction.id}", headers: @headers, as: :json
    assert_response :no_content
    assert_not Transaction.exists?(transaction.id)
  end

  test "other users transactions cannot be updated or deleted" do
    transaction = transactions(:two)
    patch "/transactions/#{transaction.id}", params: { transaction: { amount: "1.00" } }, headers: @headers, as: :json
    assert_response :not_found
    assert_equal BigDecimal("30"), transaction.reload.amount

    delete "/transactions/#{transaction.id}", headers: @headers, as: :json
    assert_response :not_found
    assert Transaction.exists?(transaction.id)
  end

  test "a nonexistent category is rejected as a validation error" do
    assert_no_difference "Transaction.count" do
      post "/transactions", params: { transaction: valid_attributes.merge(category_id: -1) }, headers: @headers, as: :json
    end
    assert_response :unprocessable_entity
    assert response.parsed_body.fetch("errors").any? { |error| error.include?("Category") }
  end

  test "an existing transaction cannot be assigned a nonexistent category" do
    transaction = transactions(:one)
    patch "/transactions/#{transaction.id}", params: { transaction: { category_id: -1 } }, headers: @headers, as: :json
    assert_response :unprocessable_entity
    assert_equal categories(:one).id, transaction.reload.category_id
  end

  test "a category may be omitted and later cleared" do
    post "/transactions", params: { transaction: valid_attributes }, headers: @headers, as: :json
    assert_response :created
    assert_nil response.parsed_body.fetch("category_id")

    patch "/transactions/#{transactions(:one).id}", params: { transaction: { category_id: nil } }, headers: @headers, as: :json
    assert_response :ok
    assert_nil transactions(:one).reload.category_id
  end

  test "another users category and an incompatible category are rejected" do
    [ categories(:two), categories(:income) ].each do |category|
      post "/transactions", params: { transaction: valid_attributes.merge(category_id: category.id) }, headers: @headers, as: :json
      assert_response :unprocessable_entity
    end
  end

  test "start date alone excludes earlier transactions" do
    get "/transactions", params: { start_date: "2026-11-01" }, headers: @headers
    assert_response :ok
    assert_equal [ transactions(:one).id, transactions(:later).id ].sort, returned_ids.sort
  end

  test "end date alone excludes later transactions" do
    get "/transactions", params: { end_date: "2026-11-01" }, headers: @headers
    assert_response :ok
    assert_equal [ transactions(:one).id, transactions(:earlier).id ].sort, returned_ids.sort
  end

  test "both date boundaries are inclusive" do
    get "/transactions", params: { start_date: "2026-11-01", end_date: "2026-11-01" }, headers: @headers
    assert_response :ok
    assert_equal [ transactions(:one).id ], returned_ids
  end

  test "no date filter returns all owned transactions" do
    get "/transactions", headers: @headers
    assert_response :ok
    assert_equal users(:one).transactions.ids.sort, returned_ids.sort
  end

  test "invalid and reversed dates return a client error" do
    get "/transactions", params: { start_date: "2026-02-30" }, headers: @headers
    assert_response :bad_request
    get "/transactions", params: { start_date: "2026-12-01", end_date: "2026-11-01" }, headers: @headers
    assert_response :bad_request
  end

  test "amounts outside the database range are rejected" do
    [ "0", "-1", "10000000000", "9999999999.999" ].each do |amount|
      post "/transactions", params: { transaction: valid_attributes.merge(amount: amount) }, headers: @headers, as: :json
      assert_response :unprocessable_entity
    end
  end

  test "the largest supported amount can be saved" do
    post "/transactions", params: { transaction: valid_attributes.merge(amount: "9999999999.99") }, headers: @headers, as: :json
    assert_response :created
    assert_equal BigDecimal("9999999999.99"), Transaction.find(response.parsed_body.fetch("id")).amount
  end

  test "pagination limits responses to ten and counts before limiting" do
    11.times { users(:one).transactions.create!(valid_attributes) }
    get "/transactions", params: { page: 1 }, headers: @headers
    assert_response :ok
    assert_equal 10, returned_ids.size
    assert_equal 14, response.parsed_body.dig("pagination", "total_count")
    assert_equal 2, response.parsed_body.dig("pagination", "total_pages")
  end

  test "transactions require authentication" do
    get "/transactions"
    assert_response :unauthorized
  end

  private

  def valid_attributes
    { amount: "50.00", date: "2026-11-01", transaction_type: "expense" }
  end

  def returned_ids
    response.parsed_body.fetch("transactions").map { |transaction| transaction.fetch("id") }
  end
end
