require "test_helper"

class WalletsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @headers = { "Authorization" => "Bearer first-user-test-token" }
  end

  test "wallets are private and start at zero" do
    post "/wallets", params: { wallet: { name: "GCash" } }, headers: @headers, as: :json
    assert_response :created
    assert_equal "0.0", response.parsed_body.fetch("balance")
    get "/wallets", headers: @headers
    assert_response :ok
    assert_not_includes response.parsed_body.map { |wallet| wallet.fetch("id") }, wallets(:two).id
    patch "/wallets/#{wallets(:two).id}", params: { wallet: { name: "Stolen" } }, headers: @headers, as: :json
    assert_response :not_found
    delete "/wallets/#{wallets(:one).id}", headers: @headers
    assert_response :unprocessable_entity
  end

  test "expenses require a funded owned wallet and can be filtered by wallet" do
    wallet = users(:one).wallets.create!(name: "Bank")
    attributes = { amount: 10, date: Date.current, transaction_type: "expense", wallet_id: wallet.id }
    post "/transactions", params: { transaction: attributes }, headers: @headers, as: :json
    assert_response :unprocessable_entity
    post "/transactions", params: { transaction: attributes.merge(transaction_type: "income") }, headers: @headers, as: :json
    assert_response :created
    post "/transactions", params: { transaction: attributes }, headers: @headers, as: :json
    assert_response :created
    assert_equal 0, wallet.balance
    get "/transactions", params: { wallet_id: wallet.id }, headers: @headers
    assert_response :ok
    assert_equal [ wallet.id ], response.parsed_body.fetch("transactions").map { |item| item.fetch("wallet_id") }.uniq
    post "/transactions", params: { transaction: attributes.merge(wallet_id: wallets(:two).id) }, headers: @headers, as: :json
    assert_response :unprocessable_entity
  end
end
