class CreateTransfers < ActiveRecord::Migration[8.1]
  def change
    create_table :transfers do |t|
      t.references :user, null: false, foreign_key: true
      t.references :source_wallet, null: false, foreign_key: { to_table: :wallets }
      t.references :destination_wallet, null: false, foreign_key: { to_table: :wallets }
      t.decimal :amount, precision: 12, scale: 2, null: false
      t.decimal :fee, precision: 12, scale: 2, null: false, default: 0
      t.date :date, null: false
      t.text :description
      t.timestamps
    end
    add_check_constraint :transfers, "amount > 0 AND fee >= 0", name: "transfers_positive_amount"
    add_check_constraint :transfers, "source_wallet_id <> destination_wallet_id", name: "transfers_distinct_wallets"
    add_reference :transactions, :transfer, foreign_key: true, index: { unique: true }
  end
end
