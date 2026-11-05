class Resource < BaseModel
  table do
    column name : String
    column internal_name : String
    column resource_type : String
    column unit : String
    column cost_cents : Int64

    column capacity_per_week : Float64?
    column lead_time_days : Int32?
    column min_stock_alert : Float64?
    column description : String?
    column tags : Array(String) = [] of String
    column is_active : Bool = true

    belongs_to workshop : Workshop
  end

  has_many resource_lots : ResourceLot

  def consumible? : Bool
    resource_type == "consumible"
  end

  def perecedero? : Bool
    resource_type == "perecedero"
  end

  def capacidad? : Bool
    resource_type == "capacidad"
  end

  def cost_dollars : Float64
    cost_cents / 100.0
  end
end

