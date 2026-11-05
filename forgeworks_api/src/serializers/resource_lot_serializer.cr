# serializador json para lotes de recursos
class ResourceLotSerializer < BaseSerializer
  def initialize(@lot : ResourceLot)
  end

  def render
    {
      id: @lot.id,
      resource_id: @lot.resource_id,
      lot_number: @lot.lot_number,
      quantity: @lot.quantity,
      received_at: @lot.received_at.to_s("%Y-%m-%d %H:%M:%S"),
      expires_at: @lot.expires_at.try(&.to_s("%Y-%m-%d %H:%M:%S")),
      cost_cents: @lot.cost_cents,
      status: @lot.status,
      notes: @lot.notes,
      is_expired: @lot.expired?,
      created_at: @lot.created_at.to_s("%Y-%m-%d %H:%M:%S")
    }
  end
end

