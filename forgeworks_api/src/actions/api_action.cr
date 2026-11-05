# clase base para las peticiones api
abstract class ApiAction < Lucky::Action
  disable_cookies
  accepted_formats [:json]

  include Api::Auth::Helpers
  include Api::Auth::RequireAuthToken
  include Lucky::EnforceUnderscoredRoute

  # revisa si el usuario tiene rol de admin
  private def require_admin
    if current_user.role.admin?
      continue
    else
      json({ message: "acceso denegado: se requieren permisos de administrador" }, status: 403)
    end
  end

  # revisa que el usuario tenga un taller asignado
  private def require_workshop
    if current_workshop?
      continue
    else
      json({ message: "no tienes un taller asignado a tu cuenta" }, status: 403)
    end
  end

  # busca el taller de la sesion activa
  memoize def current_workshop? : Workshop?
    current_user.workshop_id.try do |wid|
      WorkshopQuery.new.id(wid).first?
    end
  end

  # taller actual garantizado no nulo tras pasar require_workshop
  private def current_workshop : Workshop
    current_workshop?.as(Workshop)
  end
end
