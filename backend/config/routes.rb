Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"

  resources :users, only: [ :create ]

  get "me", to: "users#me"

  post "login", to: "sessions#create"

  delete "logout", to: "sessions#destroy"

  resources :transfers, only: [ :index, :show, :create, :destroy ]

  resources :wallets, only: [ :index, :create, :update, :destroy ]

  resources :categories, only: [ :index, :create, :update, :destroy ]

  resources :transactions, only: [ :index, :create, :update, :destroy ]

  get "summary", to: "summaries#show"
end
