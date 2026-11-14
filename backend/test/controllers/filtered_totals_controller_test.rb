require "test_helper"

class FilteredTotalsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @wallet = @user.wallets.create!(name: "Filtered totals")
    @other_wallet = @user.wallets.create!(name: "Other totals")
    @headers = { "Authorization" => "Bearer first-user-test-token" }
    @date = Date.current
    @user.transactions.create!(wallet: @wallet, amount: 1000, date: @date, transaction_type: "income")
    12.times do
      @user.transactions.create!(wallet: @wallet, amount: 10, date: @date, transaction_type: "expense", category: categories(:one))
    end
    @user.transactions.create!(wallet: @other_wallet, amount: 999, date: @date, transaction_type: "income")
    @user.transactions.create!(wallet: @wallet, amount: 30, date: @date - 1.day, transaction_type: "expense")
  end

  test "totals reflect wallet, category, type and dates across every page" do
    filters = { wallet_id: @wallet.id, start_date: @date.iso8601, end_date: @date.iso8601 }
    get "/transactions", params: filters, headers: @headers
    assert_response :ok
    assert_equal 10, response.parsed_body.fetch("transactions").size
    assert_equal({ "income" => "1000.0", "expenses" => "120.0", "net_income" => "880.0" }, response.parsed_body.fetch("summary"))
    get "/transactions", params: filters.merge(category_id: categories(:one).id, page: 2), headers: @headers
    assert_equal 2, response.parsed_body.fetch("transactions").size
    assert_equal({ "income" => "0.0", "expenses" => "120.0", "net_income" => "-120.0" }, response.parsed_body.fetch("summary"))
    get "/transactions", params: filters.merge(transaction_type: "income"), headers: @headers
    assert_equal({ "income" => "1000.0", "expenses" => "0.0", "net_income" => "1000.0" }, response.parsed_body.fetch("summary"))
    get "/transactions", params: filters.merge(wallet_id: wallets(:two).id), headers: @headers
    assert_equal({ "income" => "0.0", "expenses" => "0.0", "net_income" => "0.0" }, response.parsed_body.fetch("summary"))
    get "/transactions", params: { wallet_id: @wallet.id }, headers: @headers
    assert_equal "150.0", response.parsed_body.dig("summary", "expenses")
  end

  test "transfer totals include both wallet directions without doubling and ignore pagination" do
    11.times do
      @user.transfers.create!(source_wallet: @wallet, destination_wallet: @other_wallet, amount: 10, fee: 1, date: @date)
    end
    @user.transfers.create!(source_wallet: @other_wallet, destination_wallet: @wallet, amount: 20, fee: 2, date: @date)
    @user.transfers.create!(source_wallet: @other_wallet, destination_wallet: @wallet, amount: 5, fee: 0, date: @date - 1.day)
    filters = { wallet_id: @wallet.id, start_date: @date.iso8601, end_date: @date.iso8601 }
    [ 1, 2 ].each do |page|
      get "/transfers", params: filters.merge(page: page), headers: @headers
      assert_response :ok
      assert_equal({ "amount" => "130.0", "fees" => "13.0" }, response.parsed_body.fetch("summary"))
    end
    get "/transfers", params: { wallet_id: @wallet.id }, headers: @headers
    assert_equal({ "amount" => "135.0", "fees" => "13.0" }, response.parsed_body.fetch("summary"))
    get "/transfers", params: filters.merge(wallet_id: wallets(:two).id), headers: @headers
    assert_equal({ "amount" => "0.0", "fees" => "0.0" }, response.parsed_body.fetch("summary"))
  end
end
