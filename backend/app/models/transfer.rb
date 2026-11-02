class Transfer < ApplicationRecord
  belongs_to :user
  belongs_to :source_wallet, class_name: "Wallet"
  belongs_to :destination_wallet, class_name: "Wallet"
  has_one :fee_transaction, class_name: "Transaction", dependent: :destroy

  validates :amount, numericality: { greater_than: 0, less_than_or_equal_to: BigDecimal("9999999999.99") }
  validates :fee, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: BigDecimal("9999999999.99") }
  validates :date, presence: true
  validates :date, comparison: { less_than_or_equal_to: -> { Date.current } }, allow_nil: true
  validate :owned_distinct_wallets

  private

  def owned_distinct_wallets
    [ source_wallet, destination_wallet ].compact.each do |wallet|
      errors.add(:base, "Wallets must belong to you") if wallet.user_id != user_id
    end
    if source_wallet_id.present? && source_wallet_id == destination_wallet_id
      errors.add(:destination_wallet, "must differ from the source wallet")
    end
  end
end
