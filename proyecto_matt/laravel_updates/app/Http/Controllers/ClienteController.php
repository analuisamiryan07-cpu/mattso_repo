<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Familia;
use App\Models\Sector;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    public function index(Request $request)
    {
        $query = Cliente::query();
        
        // Búsqueda simple por nombre o cédula
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where('nombre', 'ilike', '%' . $search . '%')
                  ->orWhere('cedula', 'like', '%' . $search . '%');
        }

        $clientes = $query->orderBy('id', 'desc')->paginate(15);
        
        return view('clientes.index', compact('clientes'));
    }

    public function create()
    {
        $esquemas = [
            'CUIDADO DE PERSONAS ADULTAS MAYORES',
            'ENTRENAMIENTO CANINO',
            'DETECCIÓN DE SUSTANCIAS Y LOCALIZACIÓN DE PERSONAS',
            'DEFENSA Y PROTECCIÓN',
            'INTERVENCIÓN ASISTIDA CON CANES',
            'INSTALACIONES HIDROSANITARIAS',
            'ARMADO DE ESTRUCTURAS METÁLICAS',
            'GESTIÓN ADMINISTRATIVA DEL SISTEMA DE SALUD DESCONCENTRADO',
            'OPERACIONES DE LÍNEAS Y REDES ENERGIZADAS',
            'ACTIVIDADES AUXILIARES DE LINIERO',
            'GESTION DE SOLDADURA',
            'SOLDADURA',
            'GESTION INTEGRAL DE RIESGOS FINANCIEROS',
            'ADMINISTRACIÓN DE EMPRESAS'
        ];

        $examinadores = [
            ['nombre' => 'ALAVA MACIAS FATIMA ESPERANZA', 'cedula' => '1308176336', 'telefono' => '098 006 7174', 'email' => 'Fatimaalava@gmail.com'],
            ['nombre' => 'OÑA CALDERON CARLOS PAUL', 'cedula' => '1711365617', 'telefono' => '096 063 8245', 'email' => 'charlesbronson629@gmail.com'],
            ['nombre' => 'ALDO RUBEN RIOS MORANTE', 'cedula' => '1202804116', 'telefono' => '098 887 2797', 'email' => 'aldorios.morante@gmail.com'],
            ['nombre' => 'CAMPOS SERRANO CARLOS FABRICIO', 'cedula' => '1707598981', 'telefono' => '099 854 8190', 'email' => 'fcampostanda@yahoo.com'],
            ['nombre' => 'SEVILLA CACERES CHRISTOPHER DAVID', 'cedula' => '704696038', 'telefono' => '097 927 6586', 'email' => 'cdsc100490@hotmail.com'],
            ['nombre' => 'MERINO SORIA ESTEBAN ARMANDO', 'cedula' => '1711458966', 'telefono' => '098 5928 302', 'email' => 'esteban_merino@hotmail.com'],
            ['nombre' => 'ORBEA BAUTISTA ADRIANA ELIZABETH', 'cedula' => '1720130085', 'telefono' => '0987583421', 'email' => 'adrianaob@gmail.com'],
        ];

        return view('clientes.create', compact('esquemas', 'examinadores'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:200',
            'cedula' => 'required|string|max:15|unique:clientes,cedula',
            'telefono' => 'nullable|string|max:20',
            'correo' => 'nullable|email|max:200',
            'direccion' => 'nullable|string',
            'fecha' => 'required|date',
            'ciudad' => 'nullable|string|max:100',
            'lugar' => 'nullable|string|max:100',
            'esquema' => 'nullable|string|max:100',
            'tipo_examen' => 'nullable|string|max:50',
            'puntaje_teorico' => 'nullable|string|max:10',
            'puntaje_practico' => 'nullable|string|max:10',
            'id_familia' => 'nullable|exists:familias,id_familia',
            'id_sector' => 'nullable|exists:sectores,id_sector',
            'nombre_examinador' => 'nullable|string|max:200',
            'cedula_examinador' => 'nullable|string|max:20',
            'telefono_examinador' => 'nullable|string|max:20',
            'edad' => 'nullable|integer',
            'celular1' => 'nullable|string|max:20',
            'cv_metadata' => 'nullable|array',
        ]);

        Cliente::create($data);

        return redirect()->route('clientes.index')->with('success', 'Cliente/Estudiante registrado exitosamente.');
    }

    public function edit($id)
    {
        $cliente = Cliente::findOrFail($id);
        
        $esquemas = [
            'CUIDADO DE PERSONAS ADULTAS MAYORES',
            'ENTRENAMIENTO CANINO',
            'DETECCIÓN DE SUSTANCIAS Y LOCALIZACIÓN DE PERSONAS',
            'DEFENSA Y PROTECCIÓN',
            'INTERVENCIÓN ASISTIDA CON CANES',
            'INSTALACIONES HIDROSANITARIAS',
            'ARMADO DE ESTRUCTURAS METÁLICAS',
            'GESTIÓN ADMINISTRATIVA DEL SISTEMA DE SALUD DESCONCENTRADO',
            'OPERACIONES DE LÍNEAS Y REDES ENERGIZADAS',
            'ACTIVIDADES AUXILIARES DE LINIERO',
            'GESTION DE SOLDADURA',
            'SOLDADURA',
            'GESTION INTEGRAL DE RIESGOS FINANCIEROS',
            'ADMINISTRACIÓN DE EMPRESAS'
        ];

        $examinadores = [
            ['nombre' => 'ALAVA MACIAS FATIMA ESPERANZA', 'cedula' => '1308176336', 'telefono' => '098 006 7174', 'email' => 'Fatimaalava@gmail.com'],
            ['nombre' => 'OÑA CALDERON CARLOS PAUL', 'cedula' => '1711365617', 'telefono' => '096 063 8245', 'email' => 'charlesbronson629@gmail.com'],
            ['nombre' => 'ALDO RUBEN RIOS MORANTE', 'cedula' => '1202804116', 'telefono' => '098 887 2797', 'email' => 'aldorios.morante@gmail.com'],
            ['nombre' => 'CAMPOS SERRANO CARLOS FABRICIO', 'cedula' => '1707598981', 'telefono' => '099 854 8190', 'email' => 'fcampostanda@yahoo.com'],
            ['nombre' => 'SEVILLA CACERES CHRISTOPHER DAVID', 'cedula' => '704696038', 'telefono' => '097 927 6586', 'email' => 'cdsc100490@hotmail.com'],
            ['nombre' => 'MERINO SORIA ESTEBAN ARMANDO', 'cedula' => '1711458966', 'telefono' => '098 5928 302', 'email' => 'esteban_merino@hotmail.com'],
            ['nombre' => 'ORBEA BAUTISTA ADRIANA ELIZABETH', 'cedula' => '1720130085', 'telefono' => '0987583421', 'email' => 'adrianaob@gmail.com'],
        ];

        return view('clientes.edit', compact('cliente', 'esquemas', 'examinadores'));
    }

    public function update(Request $request, $id)
    {
        $cliente = Cliente::findOrFail($id);
        
        $data = $request->validate([
            'nombre' => 'required|string|max:200',
            'cedula' => 'required|string|max:15|unique:clientes,cedula,' . $id,
            'telefono' => 'nullable|string|max:20',
            'correo' => 'nullable|email|max:200',
            'direccion' => 'nullable|string',
            'fecha' => 'required|date',
            'ciudad' => 'nullable|string|max:100',
            'lugar' => 'nullable|string|max:100',
            'esquema' => 'nullable|string|max:100',
            'tipo_examen' => 'nullable|string|max:50',
            'puntaje_teorico' => 'nullable|string|max:10',
            'puntaje_practico' => 'nullable|string|max:10',
            'id_familia' => 'nullable|exists:familias,id_familia',
            'id_sector' => 'nullable|exists:sectores,id_sector',
            'nombre_examinador' => 'nullable|string|max:200',
            'cedula_examinador' => 'nullable|string|max:20',
            'telefono_examinador' => 'nullable|string|max:20',
            'edad' => 'nullable|integer',
            'celular1' => 'nullable|string|max:20',
            'cv_metadata' => 'nullable|array',
        ]);

        $cliente->update($data);

        return redirect()->route('clientes.index')->with('success', 'Cliente actualizado exitosamente.');
    }

    public function destroy($id)
    {
        $cliente = Cliente::findOrFail($id);
        $cliente->delete();
        return redirect()->route('clientes.index')->with('success', 'Cliente eliminado exitosamente.');
    }
}
