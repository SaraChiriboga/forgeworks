class CreateWorkshops::V20261105202109 < Avram::Migrator::Migration::V1
  def migrate
    create table_for(Workshop) do
      primary_key id : Int64
      add_timestamps
      add name : String
      add id_gov : String # puede ser ruc o cedula
      add description : String?
      add location : String
      add category : String # rubro del negocio
    end
  end

  def rollback
    drop table_for(Workshop)
  end
end
