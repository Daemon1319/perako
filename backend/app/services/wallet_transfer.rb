class WalletTransfer
  def self.call(user, transfer, destroy: false)
    user.with_lock do
      if destroy
        transfer.reload
        transfer.destroy!
      else
        transfer.save!
        if transfer.fee.positive?
          transfer.create_fee_transaction!(user: user, wallet: transfer.source_wallet,
            amount: transfer.fee, date: transfer.date, transaction_type: "expense",
            description: "Transfer fee")
        end
      end
      user.wallets.where(id: [ transfer.source_wallet_id, transfer.destination_wallet_id ]).order(:id).lock.each do |wallet|
        next unless wallet.balance.negative?

        transfer.errors.add(:base, "Insufficient funds in #{wallet.name}")
        raise ActiveRecord::RecordInvalid, transfer
      end
    end
    true
  rescue ActiveRecord::RecordInvalid => error
    transfer.errors.add(:base, error.message) unless error.record == transfer
    false
  rescue ActiveRecord::RecordNotDestroyed
    false
  end
end
