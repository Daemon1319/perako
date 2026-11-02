require "test_helper"

class WalletTransactionTest < ActiveSupport::TestCase
  setup do
    @user = users(:one)
    @wallet = @user.wallets.create!(name: "Test wallet")
    @income = @user.transactions.new(wallet: @wallet, amount: 100, date: Date.current, transaction_type: "income")
    assert WalletTransaction.call(@user, @income)
  end

  test "overspending and removing spent income roll back" do
    expense = @user.transactions.new(wallet: @wallet, amount: 101, date: Date.current, transaction_type: "expense")
    assert_not WalletTransaction.call(@user, expense)
    assert_equal 100, @wallet.balance
    expense = @user.transactions.new(wallet: @wallet, amount: 80, date: Date.current, transaction_type: "expense")
    assert WalletTransaction.call(@user, expense)
    assert_not WalletTransaction.call(@user, @income, destroy: true)
    assert @income.class.exists?(@income.id)
    assert_equal 20, @wallet.balance
    assert_not WalletTransaction.call(@user, expense, { amount: 110 })
    assert_equal 80, expense.reload.amount
  end

  test "moving income cannot leave the original wallet negative" do
    expense = @user.transactions.new(wallet: @wallet, amount: 80, date: Date.current, transaction_type: "expense")
    assert WalletTransaction.call(@user, expense)
    other = @user.wallets.create!(name: "Bank")
    assert_not WalletTransaction.call(@user, @income, { wallet_id: other.id })
    assert_equal @wallet.id, @income.reload.wallet_id
  end

  test "foreign wallets and deleting wallets with transactions are rejected" do
    assert_not WalletTransaction.call(@user, @income, { wallet_id: wallets(:two).id })
    assert_not @wallet.destroy
    assert @wallet.persisted?
  end
end
