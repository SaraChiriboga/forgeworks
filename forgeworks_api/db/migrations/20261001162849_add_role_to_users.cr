class AddRoleToUsers::V20261001162849 < Avram::Migrator::Migration::V1
  def migrate
    alter table_for(User) do # modificar tabla users
      add role : Int32, default: 0 # agregar campo rol con default 0 (0 regular, 1 admin)
    end
  end

  def rollback
    alter table_for(User) do # modificar tabla users
      remove :role # eliminar campo rol
    end
  end
end