# serializador json para recursos
class ResourceSerializer < BaseSerializer
  def initialize(@resource : Resource)
  end

  def render
    # calcular existencias sumando lotes activos y vigentes
    lotes = ResourceLotQuery.new.resource_id(@resource.id).status("active")
    stock_total = 0.0
    ahora = Time.utc

    lotes.each do |lote|
      if lote.expires_at.nil? || lote.expires_at.not_nil! > ahora
        stock_total += lote.quantity
      end
    end

    {
      id: @resource.id,
      workshop_id: @resource.workshop_id,
      name: @resource.name,
      internal_name: @resource.internal_name,
      resource_type: @resource.resource_type,
      unit: @resource.unit,
      cost_cents: @resource.cost_cents,
      cost_dollars: @resource.cost_dollars,
      capacity_per_week: @resource.capacity_per_week,
      lead_time_days: @resource.lead_time_days,
      min_stock_alert: @resource.min_stock_alert,
      description: @resource.description,
      tags: @resource.tags,
      is_active: @resource.is_active,
      available_stock: stock_total,
      created_at: @resource.created_at.to_s("%Y-%m-%d %H:%M:%S")
    }
  end
end

