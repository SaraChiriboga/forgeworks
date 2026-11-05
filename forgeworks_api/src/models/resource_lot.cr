class ResourceLot < BaseModel
  table do
    column lot_number : String
    column quantity : Float64
    column received_at : Time
    column expires_at : Time?
    column cost_cents : Int64?
    column status : String = "active"
    column notes : String?

    belongs_to resource : Resource
  end

  def active? : Bool
    status == "active"
  end

  def expired? : Bool
    expires_at.try { |exp| exp < Time.utc } || status == "expired"
  end
end

