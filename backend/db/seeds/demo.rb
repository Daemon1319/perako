# Local development demo only. Never connect this seed to a hosted database.
module DemoSeedData
  def self.run
    config = ActiveRecord::Base.connection_db_config.configuration_hash
    unless Rails.env.development? && config[:database] == "backend_development" &&
        %w[localhost 127.0.0.1].include?(config[:host]) && config[:port].to_i == 5433
      raise "Demo seeds require the local Docker development database on port 5433"
    end

    ActiveRecord::Base.transaction do
      user = User.find_or_initialize_by(email: "demo@perako.local")
      if user.new_record?
        user.assign_attributes(name: "Demo", password: "PerakoDemo123!", password_confirmation: "PerakoDemo123!")
        user.save!
      end
      wallets = %w[Cash GCash Bank].to_h { |name| [ name, user.wallets.find_or_create_by!(name: name) ] }
      categories = {}
      { "income" => %w[Salary Freelance Allowance],
        "expense" => %w[Food Groceries Transport Bills Housing Entertainment Shopping Health] }.each do |type, names|
        names.each { |name| categories[name] = user.categories.find_or_create_by!(name: name, transaction_type: type) }
      end

      [ Date.current.prev_month.beginning_of_month, Date.current.beginning_of_month ].each do |month|
        record_transaction(user, wallets["Bank"], categories["Salary"], month, 1, "income", "35000", "Monthly salary")
        record_transaction(user, wallets["GCash"], categories["Freelance"], month, 2, "income", "2400", "Freelance project")
        record_transaction(user, wallets["Cash"], categories["Allowance"], month, 3, "income", "1000", "Travel allowance")
        record_transfer(user, wallets["Bank"], wallets["GCash"], month, 2, "8000", "0", "GCash top-up")
        record_transfer(user, wallets["Bank"], wallets["Cash"], month, 3, "5000", "15", "ATM withdrawal")

        [
          [ "Bank", "Housing", 1, "8500", "Monthly rent" ],
          [ "Bank", "Bills", 4, "1850", "Electricity bill" ],
          [ "Bank", "Bills", 5, "1499", "Internet bill" ],
          [ "GCash", "Groceries", 3, "1350", "Weekly groceries" ],
          [ "GCash", "Groceries", 8, "980", "Market supplies" ],
          [ "GCash", "Groceries", 12, "540", "Pantry refill" ],
          [ "GCash", "Food", 5, "195", "Lunch delivery" ],
          [ "GCash", "Food", 7, "110", "Coffee break" ],
          [ "GCash", "Entertainment", 10, "450", "Movie night" ],
          [ "GCash", "Shopping", 11, "899", "Everyday essentials" ],
          [ "GCash", "Health", 13, "350", "Pharmacy supplies" ],
          [ "Cash", "Food", 2, "165", "Lunch near work" ],
          [ "Cash", "Food", 4, "220", "Dinner with friends" ],
          [ "Cash", "Food", 8, "350", "Weekend meal" ],
          [ "Cash", "Food", 12, "280", "Family snacks" ],
          [ "Cash", "Transport", 2, "40", "Bus fare to work" ],
          [ "Cash", "Transport", 5, "65", "Ride home" ],
          [ "Cash", "Transport", 9, "90", "Weekend commute" ],
          [ "Cash", "Transport", 13, "150", "Late trip home" ],
          [ "Cash", "Health", 6, "450", "Vitamins" ],
          [ "Cash", "Shopping", 10, "350", "Household supplies" ],
          [ "Cash", nil, 14, "125", "Small cash purchase" ]
        ].each do |wallet_name, category_name, day, amount, description|
          record_transaction(user, wallets[wallet_name], categories[category_name], month, day, "expense", amount, description)
        end
      end
      puts "Demo account ready: #{user.email}"
      puts "#{user.wallets.count} wallets, #{user.categories.count} categories, #{user.transactions.count} transactions, #{user.transfers.count} transfers"
    end
  end

  def self.record_transaction(user, wallet, category, month, day, type, amount, description)
    return if user.transactions.where(date: month.all_month).exists?(description: description, transaction_type: type)

    record = user.transactions.new(wallet: wallet, category: category, date: [ month + day - 1, Date.current ].min,
      transaction_type: type, amount: amount, description: description)
    raise ActiveRecord::RecordInvalid, record unless WalletTransaction.call(user, record)
  end

  def self.record_transfer(user, source, destination, month, day, amount, fee, description)
    return if user.transfers.where(date: month.all_month).exists?(description: description)

    record = user.transfers.new(source_wallet: source, destination_wallet: destination,
      date: [ month + day - 1, Date.current ].min, amount: amount, fee: fee, description: description)
    raise ActiveRecord::RecordInvalid, record unless WalletTransfer.call(user, record)
  end
end

DemoSeedData.run
