require "test_helper"

class WalletConcurrencyTest < ActiveSupport::TestCase
  self.use_transactional_tests = false

  test "simultaneous expenses cannot spend the same balance twice" do
    user = User.create!(name: "Concurrency", email: "wallet-concurrency@example.test", password: "LearningRails123!")
    begin
      wallet = user.wallets.create!(name: "Cash")
      income = user.transactions.new(wallet: wallet, amount: 100, date: Date.current, transaction_type: "income")
      assert WalletTransaction.call(user, income)
      ready = Queue.new
      start = Queue.new
      workers = 2.times.map do
        Thread.new do
          ActiveRecord::Base.connection_pool.with_connection do
            owner = User.find(user.id)
            expense = owner.transactions.new(wallet_id: wallet.id, amount: 80, date: Date.current, transaction_type: "expense")
            ready << true
            start.pop
            WalletTransaction.call(owner, expense)
          end
        end
      end
      2.times { ready.pop }
      2.times { start << true }
      assert_equal [ false, true ], workers.map(&:value).sort_by { |result| result ? 1 : 0 }
      assert_equal 20, wallet.balance
    ensure
      user.destroy!
    end
  end
end
