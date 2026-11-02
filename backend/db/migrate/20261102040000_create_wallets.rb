class CreateWallets < ActiveRecord::Migration[8.1]
  def change
    create_table :wallets do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false, limit: 100
      t.timestamps
    end
    add_index :wallets, [ :user_id, :name ], unique: true
    add_reference :transactions, :wallet, foreign_key: true

    reversible do |dir|
      dir.up do
        # Preserve any records that remain when upgrading an existing database.
        execute <<~SQL
          INSERT INTO wallets (user_id, name, created_at, updated_at)
          SELECT DISTINCT user_id, 'Unassigned', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM transactions;
          UPDATE transactions SET wallet_id = wallets.id FROM wallets
          WHERE wallets.user_id = transactions.user_id AND wallets.name = 'Unassigned';
        SQL
      end
    end
    change_column_null :transactions, :wallet_id, false
  end
end
