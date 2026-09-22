<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PaymentApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly array $order,
        public readonly string $pdfPath,
    ) {}

    public function build(): static
    {
        return $this
            ->subject('Inscripción confirmada — IN SAPPER Industries')
            ->view('emails.payment_approved')
            ->attachData('PRUEBA DE ADJUNTO - ' . now(), 'prueba.txt', ['mime' => 'text/plain'])
            ->attach($this->pdfPath, [
                'as'   => 'Comprobante_Inscripcion.pdf',
                'mime' => 'application/pdf',
            ]);
    }
}
