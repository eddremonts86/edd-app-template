# Multi-tenancy and Row-Level Security — design notes

> **Status:** Reference notes — not yet implemented in this template. Captures principles to apply when adding multi-tenant data, RBAC, and PostgreSQL Row-Level Security to a derived app.
>
> **Source:** Working notes migrated from `dbUpdates.txt` (Jun 2026).

## 1. Multi-tenancy: separar los datos por usuario, empresa o tenant

Es la base de casi todo sistema de permisos.

En vez de que todos vean todos los registros, cada fila pertenece a un usuario, organización, workspace, proyecto o tenant.

Ejemplo:

```text
tasks
- id
- title
- user_id
```

Entonces, cuando John entra a la app, solo debería ver tareas donde:

```text
tasks.user_id = john.id
```

Esto sirve para apps tipo Linear, Notion, dashboards SaaS, CRMs, paneles internos, etc.

**Regla práctica:** cada tabla sensible debe tener alguna forma de saber “a quién pertenece esto” o “quién puede verlo”: `user_id`, `organization_id`, `workspace_id`, `project_id`, etc.

---

## 2. Row-Level Security, RLS: que la base de datos bloquee filas automáticamente

El problema de solo usar `WHERE user_id = current_user` en el código es que alguien puede olvidarlo.

Ejemplo peligroso:

```sql
select * from tasks;
```

Si no tienes protección en la base de datos, eso podría devolver tareas de todos los usuarios.

Con **Row-Level Security**, la base de datos aplica reglas por fila. Aunque el código pida todas las tareas, la base de datos solo devuelve las que ese usuario puede ver.

Una política típica sería:

```text
El usuario puede leer una tarea si task.user_id = auth.uid()
```

La idea es que RLS proteja operaciones como:

```text
SELECT
INSERT
UPDATE
DELETE
```

**Regla práctica:** no confíes solo en el frontend ni solo en la API. Usa RLS para que la base de datos sea la última barrera de seguridad.

---

## 3. Seguir filtrando en las queries por rendimiento

RLS protege, pero no debería ser tu único filtro.

Aunque RLS evite fugas, es más eficiente que tu query también filtre:

```sql
select * from tasks
where user_id = auth.uid();
```

¿Por qué? Porque si haces:

```sql
select * from tasks;
```

la base de datos podría tener que evaluar la política RLS contra muchas más filas.

**Resumen:**
`WHERE` en la query = rendimiento.
RLS en la base de datos = seguridad.

Usa ambos.

---

## 4. Ownership simple: “este recurso pertenece a este usuario”

Es el primer modelo de permisos.

Ejemplo:

```text
Una tarea tiene un owner.
Solo el owner puede verla, editarla o borrarla.
```

Esto funciona para apps simples: notas privadas, listas personales, configuraciones de usuario, documentos individuales.

Pero se queda corto cuando quieres colaboración.

Por ejemplo:

```text
Yo soy dueño de una tarea.
Quiero que mi jefe pueda verla.
Quiero que un diseñador pueda editarla.
Otra persona no debería verla.
```

Ahí necesitas algo más potente.

---

## 5. RBAC: Role-Based Access Control

RBAC significa **control de acceso basado en roles**.

En vez de decir solamente “este usuario es dueño de esta tarea”, defines roles como:

```text
owner
editor
viewer
```

Y permisos como:

```text
tasks.read
tasks.write
tasks.create
tasks.delete
```

Después conectas roles con permisos:

```text
viewer  -> tasks.read
editor  -> tasks.read, tasks.write
owner   -> tasks.read, tasks.write, tasks.create, tasks.delete
```

Así puedes expresar reglas más reales:

```text
Tyler puede leer esta tarea porque es viewer.
Tyler no puede editarla porque viewer no tiene tasks.write.
John puede borrarla porque es owner.
Sam no puede verla porque no tiene ningún rol sobre esa tarea.
```

**Regla práctica:** usa RBAC cuando tengas colaboración, equipos, organizaciones, proyectos compartidos o distintos niveles de acceso.

---

## 6. Tablas intermedias para asignar roles por recurso

Para RBAC necesitas tablas que digan qué rol tiene cada usuario sobre cada recurso.

Ejemplo:

```text
task_roles
- task_id
- user_id
- role
```

Una fila podría decir:

```text
task_id: 123
user_id: john
role: owner
```

Otra:

```text
task_id: 123
user_id: tyler
role: viewer
```

Y otra:

```text
task_id: 123
user_id: designer
role: editor
```

Esto es mucho más flexible que tener solo:

```text
tasks.user_id
```

Porque ahora una misma tarea puede tener muchos usuarios con permisos distintos.

---

## 7. Tabla de permisos: separar roles de acciones concretas

En sistemas más limpios, no codificas todo directamente en la app. Creas una tabla que mapea roles a permisos.

Ejemplo conceptual:

```text
permissions
- role
- permission
```

Con datos como:

```text
viewer -> tasks.read
editor -> tasks.read
editor -> tasks.write
owner  -> tasks.read
owner  -> tasks.write
owner  -> tasks.create
owner  -> tasks.delete
```

Esto te permite cambiar qué puede hacer un rol sin reescribir toda la lógica.

**Ventaja:** el modelo queda más mantenible, escalable y fácil de auditar.

---

## 8. Funciones de autorización en la base de datos

En vez de repetir lógica complicada en cada política, puedes crear una función como:

```text
authorized_task(user_id, permission, task_id)
```

Esa función devuelve:

```text
true
false
```

Internamente hace dos cosas:

```text
1. Busca qué rol tiene el usuario sobre esa tarea.
2. Comprueba si ese rol tiene el permiso solicitado.
```

Después puedes usarla en RLS:

```text
SELECT permitido si authorized_task(user, 'tasks.read', task_id)
UPDATE permitido si authorized_task(user, 'tasks.write', task_id)
DELETE permitido si authorized_task(user, 'tasks.delete', task_id)
```

**Regla práctica:** encapsula la lógica compleja de permisos en funciones reutilizables. Así tus políticas RLS quedan más simples.

---

## 9. Políticas distintas para leer, crear, editar y borrar

No todos los permisos son iguales.

Alguien puede tener permiso para leer pero no para editar. Otro puede editar pero no borrar.

Por eso conviene separar permisos por acción:

```text
read
write
create
delete
```

Y aplicarlos de forma separada:

```text
SELECT -> requiere tasks.read
INSERT -> requiere tasks.create
UPDATE -> requiere tasks.write
DELETE -> requiere tasks.delete
```

Esto evita errores como dar acceso total cuando solo querías dar acceso de lectura.

---

## 10. Permisos heredados por proyecto, organización o workspace

El video también muestra el caso de proyectos.

Una tarea puede pertenecer a un proyecto:

```text
projects
tasks.project_id
```

Entonces puedes tener permisos a nivel de proyecto:

```text
project_roles
- project_id
- user_id
- role
```

Y hacer que las tareas hereden permisos del proyecto.

Ejemplo:

```text
Si soy owner del proyecto, puedo ver las tareas del proyecto.
Si soy editor del proyecto, puedo editar tareas del proyecto.
Si soy viewer del proyecto, solo puedo leerlas.
```

Esto evita tener que asignar permisos tarea por tarea.

**Regla práctica:** para apps complejas, estructura permisos por niveles:

```text
organization
  workspace
    project
      task
        comment
```

Y decide qué permisos se heredan hacia abajo.

---

## 11. JWT claims para que la UI sepa qué mostrar

El frontend necesita saber si debe mostrar:

```text
Botón Editar
Botón Borrar
Etiqueta Read-only
Formulario de creación
Opciones de administración
```

Para eso puedes meter información de roles/permisos dentro del JWT como **claims**.

Ejemplo conceptual:

```json
{
  "task_roles": {
    "task_123": "owner",
    "task_456": "viewer"
  },
  "project_roles": {
    "project_abc": "editor"
  }
}
```

Luego la página usa esos claims para renderizar condicionalmente:

```text
Si tiene tasks.write -> mostrar botón Editar.
Si tiene tasks.delete -> mostrar botón Borrar.
Si solo tiene tasks.read -> mostrar modo lectura.
```

**Importante:** esto es para experiencia de usuario, no para seguridad final.

---

## 12. Auth hooks para añadir permisos al JWT

Los permisos no aparecen mágicamente en el JWT. Se pueden añadir con **auth hooks**.

Cuando el usuario inicia sesión o se refresca su sesión, se ejecuta una función que:

```text
1. Busca sus roles en la base de datos.
2. Busca permisos sobre proyectos y tareas.
3. Añade esos datos como claims al JWT.
```

Así el frontend puede consultar esos claims y adaptar la página.

---

## 13. El problema del caché del JWT

El video recalca una trampa importante: los JWT pueden quedar desactualizados.

Ejemplo:

```text
John era owner.
Su rol cambia a viewer.
Pero su JWT todavía dice owner hasta que se refresque la sesión.
```

Eso puede hacer que la UI siga mostrando botones de editar o borrar.

Pero eso no debería ser un problema de seguridad si la base de datos está bien protegida.

¿Por qué? Porque aunque la UI muestre el botón, cuando John intente borrar, RLS debería consultar el permiso actual en la base de datos y bloquearlo.

**Regla crítica:** no uses el JWT como fuente definitiva de autorización para acciones sensibles. Úsalo para renderizar la UI. Para permitir o bloquear acciones reales, consulta permisos actuales en la base de datos.

---

## 14. No confiar en el frontend

Una página bien estructurada puede ocultar botones, rutas y formularios, pero eso no basta.

Cualquier usuario avanzado puede intentar:

```text
Llamar la API manualmente.
Modificar requests.
Usar la consola del navegador.
Enviar IDs de recursos ajenos.
Repetir una petición antigua.
```

Por eso:

```text
Frontend = experiencia.
Backend/API = validación.
Base de datos/RLS = seguridad final.
```

---

## 15. Modelo recomendado para páginas con permisos bien estructurados

Una buena arquitectura sería:

```text
1. Multi-tenancy
   Cada recurso pertenece a un usuario, organización, workspace o proyecto.

2. RLS
   La base de datos bloquea filas no autorizadas.

3. RBAC
   Los usuarios tienen roles como owner, editor, viewer.

4. Tabla de permisos
   Cada rol se mapea a acciones concretas.

5. Tablas de roles por recurso
   Por ejemplo task_roles, project_roles, organization_roles.

6. Funciones de autorización
   authorized_task(), authorized_project(), etc.

7. Políticas RLS por acción
   read, create, write, delete.

8. JWT claims
   El frontend recibe permisos para saber qué UI mostrar.

9. Auth hooks
   Los claims del JWT se generan al iniciar sesión o refrescar sesión.

10. Validación real en base de datos
   Nunca confiar en permisos cacheados del JWT para acciones críticas.
```

---

## Checklist práctico para tus páginas

Para cada página o recurso, pregúntate:

```text
¿Quién puede ver esta página?
¿Quién puede crear contenido aquí?
¿Quién puede editarlo?
¿Quién puede borrarlo?
¿El permiso depende del usuario, del proyecto, del workspace o de la organización?
¿La UI oculta acciones no permitidas?
¿La API valida la acción?
¿La base de datos bloquea filas no permitidas?
¿Qué pasa si el JWT está desactualizado?
¿Qué pasa si alguien llama la API directamente?
```

La versión corta: **usa JWT para que la página se vea correcta, RBAC para modelar permisos, y RLS en la base de datos para que el sistema sea seguro aunque el frontend o la API se equivoquen.**
