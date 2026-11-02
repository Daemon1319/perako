require "test_helper"

class TransfersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @source = @user.wallets.create!(name: "Transfer source")
    @destination = @user.wallets.create!(name: "Transfer destination")
    @user.transactions.create!(wallet: @source, amount: 1000, date: Date.current, transaction_type: "income")
    @headers = { "Authorization" => "Bearer first-user-test-token" }
    @attributes = { source_wallet_id: @source.id, destination_wallet_id: @destination.id, amount: 500, fee: 10, date: Date.current }
  end

  test "transfer deducts fee once and deleting reverses all effects" do
    expenses = @user.transactions.by_type("expense").sum(:amount)
    post "/transfers", params: { transfer: @attributes }, headers: @headers, as: :json
    assert_response :created
    id = response.parsed_body.fetch("id")
    assert_equal 490, @source.balance
    assert_equal 500, @destination.balance
    assert_equal expenses + 10, @user.transactions.by_type("expense").sum(:amount)
    fee = Transfer.find(id).fee_transaction
    patch "/transactions/#{fee.id}", params: { transaction: { amount: 1 } }, headers: @headers, as: :json
    assert_response :unprocessable_entity
    delete "/transactions/#{fee.id}", headers: @headers
    assert_response :unprocessable_entity
    delete "/transfers/#{id}", headers: @headers
    assert_response :no_content
    assert_equal 1000, @source.balance
    assert_equal 0, @destination.balance
    assert_not Transaction.exists?(fee.id)
  end

  test "spent transfers cannot be deleted and funding income cannot be removed" do
    post "/transfers", params: { transfer: @attributes }, headers: @headers, as: :json
    assert_response :created
    id = response.parsed_body.fetch("id")
    post "/transactions", params: { transaction: { wallet_id: @destination.id, amount: 100, date: Date.current, transaction_type: "expense" } }, headers: @headers, as: :json
    assert_response :created
    delete "/transfers/#{id}", headers: @headers
    assert_response :unprocessable_entity
    assert Transfer.find(id).fee_transaction
    assert_equal 490, @source.balance
    assert_equal 400, @destination.balance
    income = @source.transactions.by_type("income").first
    delete "/transactions/#{income.id}", headers: @headers
    assert_response :unprocessable_entity
  end

  test "invalid transfers fail atomically including insufficient fee funds" do
    [ { amount: 1000 }, { amount: 0 }, { fee: -1 }, { destination_wallet_id: @source.id },
      { destination_wallet_id: wallets(:two).id }, { source_wallet_id: -1 }, { date: nil } ].each do |changes|
      assert_no_difference [ "Transfer.count", "Transaction.count" ] do
        post "/transfers", params: { transfer: @attributes.merge(changes) }, headers: @headers, as: :json
      end
      assert_response :unprocessable_entity
      assert_equal 1000, @source.balance
    end
  end

  test "zero fee transfers have no expense and are owner scoped and filterable" do
    post "/transfers", params: { transfer: @attributes.merge(fee: 0) }, headers: @headers, as: :json
    assert_response :created
    id = response.parsed_body.fetch("id")
    assert_nil Transfer.find(id).fee_transaction
    get "/transfers", params: { wallet_id: @destination.id, start_date: Date.current.iso8601 }, headers: @headers
    assert_response :ok
    assert_equal [ id ], response.parsed_body.fetch("transfers").map { |item| item.fetch("id") }
    foreign_headers = { "Authorization" => "Bearer second-user-test-token" }
    get "/transfers/#{id}", headers: foreign_headers
    assert_response :not_found
    delete "/transfers/#{id}", headers: foreign_headers
    assert_response :not_found
    delete "/wallets/#{@destination.id}", headers: @headers
    assert_response :unprocessable_entity
  end
end
