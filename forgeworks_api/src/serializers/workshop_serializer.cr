# serializador json para talleres
class WorkshopSerializer < BaseSerializer
  def initialize(@workshop : Workshop)
  end

  def render
    {
      id: @workshop.id,
      name: @workshop.name,
      id_gov: @workshop.id_gov,
      description: @workshop.description,
      location: @workshop.location,
      category: @workshop.category,
      created_at: @workshop.created_at.to_s("%Y-%m-%d %H:%M:%S")
    }
  end
end

