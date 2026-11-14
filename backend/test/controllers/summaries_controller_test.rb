require "test_helper"

class SummariesControllerTest < ActionDispatch::IntegrationTest
  test "monthly summary only includes the authenticated users transactions in the selected month" do
    users(:one).transactions.create!(amount: "1000.00", date: "2026-11-01", transaction_type: "income", wallet: wallets(:one))
    get "/summary", params: { month: "2026-11" }, headers: { "Authorization" => "Bearer first-user-test-token" }
    assert_response :ok
    assert_equal "2026-11", response.parsed_body.fetch("month")
    assert_equal BigDecimal("1000"), BigDecimal(response.parsed_body.fetch("income"))
    assert_equal BigDecimal("150"), BigDecimal(response.parsed_body.fetch("expenses"))
    assert_equal BigDecimal("850"), BigDecimal(response.parsed_body.fetch("net_income"))
  end

  test "all time summary includes every owned date and excludes other users" do
    users(:one).transactions.create!(amount: "1000.00", date: "2026-09-15", transaction_type: "income", wallet: wallets(:one))
    get "/summary", params: { period: "all" }, headers: { "Authorization" => "Bearer first-user-test-token" }
    assert_response :ok
    assert_nil response.parsed_body.fetch("month")
    assert_equal "all", response.parsed_body.fetch("period")
    assert_equal BigDecimal("1000"), BigDecimal(response.parsed_body.fetch("income"))
    assert_equal BigDecimal("180"), BigDecimal(response.parsed_body.fetch("expenses"))
    assert_equal BigDecimal("820"), BigDecimal(response.parsed_body.fetch("net_income"))
  end

  test "monthly category breakdown includes uncategorized fees and excludes other users and dates" do
    user = users(:one)
    category = user.categories.create!(name: "Travel", transaction_type: "expense")
    wallet = user.wallets.create!(name: "Breakdown wallet")
    destination = user.wallets.create!(name: "Breakdown destination")
    user.transactions.create!(wallet: wallet, amount: 1000, date: "2026-11-01", transaction_type: "income")
    user.transactions.create!(wallet: wallet, category: category, amount: "25.50", date: "2026-11-01", transaction_type: "expense")
    user.transactions.create!(wallet: wallet, amount: "12.25", date: "2026-11-01", transaction_type: "expense")
    transfer = user.transfers.new(source_wallet: wallet, destination_wallet: destination,
      amount: 100, fee: 5, date: "2026-11-01")
    assert WalletTransfer.call(user, transfer)
    get "/summary", params: { month: "2026-11" }, headers: { "Authorization" => "Bearer first-user-test-token" }
    assert_response :ok
    result = response.parsed_body
    breakdown = result.fetch("expense_categories")
    assert_equal [ categories(:one).name, "Travel", "Uncategorized" ], breakdown.map { |item| item.fetch("name") }
    assert_equal [ "150.0", "25.5", "17.25" ], breakdown.map { |item| item.fetch("amount") }
    assert_equal BigDecimal(result.fetch("expenses")), breakdown.sum { |item| BigDecimal(item.fetch("amount")) }
    assert_not_includes breakdown.map { |item| item.fetch("category_id") }, categories(:two).id

    category.destroy!
    get "/summary", params: { month: "2026-11" }, headers: { "Authorization" => "Bearer first-user-test-token" }
    uncategorized = response.parsed_body.fetch("expense_categories").find { |item| item.fetch("category_id").nil? }
    assert_equal "42.75", uncategorized.fetch("amount")
  end

  test "a month with no expenses has an empty category breakdown" do
    get "/summary", params: { month: "2020-01" }, headers: { "Authorization" => "Bearer first-user-test-token" }
    assert_response :ok
    assert_equal [], response.parsed_body.fetch("expense_categories")
  end
end
