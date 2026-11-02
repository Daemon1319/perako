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
end
