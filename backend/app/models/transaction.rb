class Transaction < ApplicationRecord
  belongs_to :user
  belongs_to :wallet
  belongs_to :transfer, optional: true
  belongs_to :category, optional: true

  validates :amount, numericality: { greater_than: 0, less_than_or_equal_to: BigDecimal("9999999999.99") }
  validates :date, presence: true
  validates :transaction_type, inclusion: { in: %w[income expense] }
  validates :category, presence: true, if: -> { category_id.present? }

  validate :category_matches_transaction
  validate :wallet_belongs_to_user

  scope :by_type, ->(type) { where(transaction_type: type) if type.present? }
  scope :by_category, ->(category_id) { where(category_id: category_id) if category_id.present? }
  scope :between_dates, ->(start_date, end_date) { where(date: start_date..end_date) }

  private

  def wallet_belongs_to_user
    errors.add(:wallet, "must belong to you") if wallet && wallet.user_id != user_id
  end

  def category_matches_transaction
    return unless category

    if category.user_id != user_id
      errors.add(:category, "must belong to you")
    end

    if category.transaction_type != transaction_type
      errors.add(:category, "must match the transaction type")
    end
  end
end
