class Wallet < ApplicationRecord
  belongs_to :user
  has_many :transactions, dependent: :restrict_with_error
  has_many :outgoing_transfers, class_name: "Transfer", foreign_key: :source_wallet_id, dependent: :restrict_with_error
  has_many :incoming_transfers, class_name: "Transfer", foreign_key: :destination_wallet_id, dependent: :restrict_with_error

  normalizes :name, with: ->(name) { name.strip }
  validates :name, presence: true, length: { maximum: 100 }, uniqueness: { scope: :user_id }

  def balance
    amount = Transaction.uncached do
      transactions.sum(Arel.sql("CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END"))
    end
    incoming, outgoing = Transfer.uncached do
      [ incoming_transfers.sum(:amount), outgoing_transfers.sum(:amount) ]
    end
    BigDecimal(amount.to_s) + BigDecimal(incoming.to_s) - BigDecimal(outgoing.to_s)
  end
end
