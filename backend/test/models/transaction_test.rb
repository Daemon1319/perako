require "test_helper"

class TransactionTest < ActiveSupport::TestCase
  test "income and expenses allow today but reject future dates in Manila" do
    travel_to Time.zone.local(2026, 11, 2, 23, 30) do
      %w[income expense].each do |type|
        transaction = users(:one).transactions.new(wallet: wallets(:one), amount: 10,
          date: Date.current, transaction_type: type)
        assert transaction.valid?
        transaction.date = Date.current + 1.day
        assert_not transaction.valid?
        assert transaction.errors[:date].any?
        transaction.date = Date.current - 1.day
        assert transaction.valid?
      end
    end
  end
end
