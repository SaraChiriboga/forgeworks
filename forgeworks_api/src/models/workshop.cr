class Workshop < BaseModel
  table do
    column name : String
    column id_gov : String
    column description : String?
    column location : String
    column category : String
  end

  has_many users : User
  has_many resources : Resource
end
 