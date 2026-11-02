# Serialize balance-affecting writes per owner, including moves between wallets.
class WalletTransaction
  def self.call(user, record, attributes = {}, destroy: false)
    user.with_lock do
      record.reload if record.persisted?
      if record.transfer_id.present?
        record.errors.add(:base, "Transfer fees must be managed through the transfer")
        raise ActiveRecord::RecordInvalid, record
      end
      old_wallet_id = record.wallet_id
      record.assign_attributes(attributes) unless destroy
      if destroy
        record.destroy!
      else
        record.save!
      end
      wallets = user.wallets.where(id: [ old_wallet_id, record.wallet_id ].compact.uniq).order(:id).lock
      wallets.each do |wallet|
        next unless wallet.balance.negative?

        record.errors.add(:base, "Insufficient funds in #{wallet.name}")
        raise ActiveRecord::RecordInvalid, record
      end
    end
    true
  rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotDestroyed
    false
  end
end
