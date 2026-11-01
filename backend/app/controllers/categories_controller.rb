class CategoriesController < ApplicationController
  before_action :authenticate_user!

  def index
    categories = current_user.categories.order(:name)

    render json: categories.as_json(only: [ :id, :name, :transaction_type ]), status: :ok
  end

  def create
    category = current_user.categories.build(category_params)

    if category.save
      render json: category.as_json(only: [ :id, :name, :transaction_type ]), status: :created
    else
      render json: { errors: category.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    category = current_user.categories.find(params[:id])

    if category.update(category_params.except(:transaction_type))
      render json: category.as_json(only: [ :id, :name, :transaction_type ])
    else
      render json: { errors: category.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    category = current_user.categories.find(params[:id])

    category.destroy!
    head :no_content
  end

  private

  def category_params
    params.require(:category).permit(:name, :transaction_type)
  end
end
