# migracion para agregar ciertos campos que olvidé
class AddCamposToUsers::V20261005225130 < Avram::Migrator::Migration::V1
  def migrate
    alter table_for(User) do
      add name : String,default: "Nombre" 
      add last_name : String, default: "Apellido"
      add phone : String, default: "0000000000"
    end
  end

  def rollback
    alter table_for(User) do
      remove :name
      remove :lastName
      remove :phone
    end
  end
end
