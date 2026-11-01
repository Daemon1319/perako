class Category < ApplicationRecord
  belongs_to :user

  has_many :transactions, dependent: :nullify

  validates :name, presence: true
  validates :transaction_type, inclusion: { in: %w[income expense] }
end
