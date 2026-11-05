class AddWorkshopIdToUsers::V20261105203940 < Avram::Migrator::Migration::V1
  def migrate
    alter table_for(User) do
      add_belongs_to workshop : Workshop?, on_delete: :nullify
    end
  end

  def rollback
    alter table_for(User) do
      remove_belongs_to :workshop
    end
  end
end
