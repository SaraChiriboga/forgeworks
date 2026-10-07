import { Component, inject, OnInit, signal} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {AuthService} from "../../core/services/auth.service";
import { NewUser, User, UserService } from '../../core/services/user.service';
import Swal from 'sweetalert2';
import { ResponsiveService } from '../../core/services/responsive.service';

@Component({
  imports: [FormsModule], // permite usar [(ngModel)] en el formulario
  selector: 'app-users',
  styleUrl: './users.css',
  templateUrl: './users.html',
})
export class Users implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  public responsiveService = inject(ResponsiveService);

  users = signal<User[]>([]); // señal con array vacio
  errorMessage = signal('');
  updatingUserId = signal<number | null>(null); // señal para controlar el texto del boton acorde a la accion

  newUser: NewUser = {
    name: '',
    last_name: '',
    phone: '',
    email: '',
    password: '',
    password_confirmation: ''
  };

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void{
    this.userService.getUsers().subscribe({ // los observables son asincrónicos, por eso usamos subscribe para recibir la respuesta cuando llegue
      next: (data) => {
        this.users.set(data); //se guarda la lista de usuarios obtenida del backend
      },
      error: (err) => {
        this.errorMessage.set('Error al cargar los usuarios.'); // se guarda el mensaje de error en caso de que falle la petición
        console.error(err);
      }
    });
  }

  createUser() {

    this.userService.createUser(this.newUser).subscribe({
      next: (createdUser) => {
        this.loadUsers(); // recargar la lista de usuarios después de crear uno nuevo
        this.cleanForm(); // limpiar el formulario después de crear el usuario
      },
      error: (err) => {
        this.errorMessage.set('Error al crear el usuario.'); // se guarda el mensaje de error en caso de que falle la petición
      }
    });
  }

  readUser(user: User) {
    Swal.fire({
      title: `${user.name} ${user.last_name}`,
      html: `
        <div style="text-align: left; font-size: 0.95rem; line-height: 1.8;">
          <p><strong>ID:</strong> ${user.id}</p>
          <p><strong>Correo:</strong> ${user.email}</p>
          <p><strong>Teléfono:</strong> ${user.phone}</p>
          <p><strong>Rol en el sistema:</strong> <span style="badge">${user.role}</span></p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#000'
    })
  }
  
  selectUserToUpdate(user: User){
    this.updatingUserId.set(user.id);
    this.newUser = {
      name: user.name,
      last_name: user.last_name,
      phone: user.phone,
      email: user.email,
      password: '', // en edicion se dejan vacías para no sobreescribirlas
      password_confirmation: ''
    };

  }
  
  saveUser() {
    const id = this.updatingUserId();

    if(id !== null){ // editando
      this.userService.updateUser(id, this.newUser).subscribe({
        next: () => {
          this.loadUsers();      // recarga la tabla con los nuevos datos
          this.cancelUpdate();     // regresa el formulario a modo "Crear"
        },
        error: (err) => {
          this.errorMessage.set('Error al actualizar el usuario.');
          console.error(err);
        }
      });
    } else {
      // creando
      this.createUser();
    }
  }

  cancelUpdate(){
    this.updatingUserId.set(null);
    this.cleanForm();
  }

  deleteUser(userId: number) {
    this.userService.deleteUser(userId).subscribe({
      next: () => {
        this.loadUsers(); // recargar la lista de usuarios después de eliminar uno
      },
      error: (err) => {
        this.errorMessage.set('Error al eliminar el usuario.'); // se guarda el mensaje de error en caso de que falle la petición
      }
    });
  }

  logout(){
    this.authService.logout();
  }

  cleanForm() {
    this.newUser = {
      name: '',
      last_name: '',
      phone: '',
      email: '',
      password: '',
      password_confirmation: ''
    };
  }
}
