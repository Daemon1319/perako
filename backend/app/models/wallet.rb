class Wallet < ApplicationRecord
  belongs_to :user
  has_many :transactions, dependent: :restrict_with_error

  normalizes :name, with: ->(name) { name.strip }
  validates :name, presence: true, length: { maximum: 100 }, uniqueness: { scope: :user_id }

  def balance
    amount = Transaction.uncached do
      transactions.sum(Arel.sql("CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END"))
    end
    BigDecimal(amount.to_s)
  end
end
