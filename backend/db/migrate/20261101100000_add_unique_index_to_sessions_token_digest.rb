class AddUniqueIndexToSessionsTokenDigest < ActiveRecord::Migration[8.1]
  def change
    add_index :sessions, :token_digest, unique: true
  end
end
