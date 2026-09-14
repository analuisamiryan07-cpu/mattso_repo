// Carga el quiz (sin respuestas correctas — el backend nunca las manda antes
// de calificar), deja responder, y envía todo junto al enviar. El límite de
// tiempo (si existe) se muestra como cuenta regresiva visual; el envío real lo
// sigue validando el usuario haciendo clic en "Enviar" — el backend no fuerza
// un auto-envío server-side todavía (ver Moodles/lms/docs/INTEGRACION.md §8).

import { useEffect, useState } from 'react';
import { lmsService } from '@api/lmsService';
import { useToast } from '@context/ToastContext';
import './QuizRunner.css';

const QuizRunner = ({ contentItem, onCompleted }) => {
  const { addToast } = useToast();
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    lmsService
      .getQuiz(contentItem.id)
      .then((data) => {
        if (cancelled) return;
        setQuiz(data);
        if (data.time_limit_seconds) setSecondsLeft(data.time_limit_seconds);
      })
      .catch(() => addToast('No se pudo cargar el cuestionario.', 'error'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [contentItem.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (secondsLeft == null || result) return;
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, result]);

  const startAttempt = async () => {
    try {
      const a = await lmsService.iniciarIntento(quiz.id);
      setAttempt(a);
    } catch (err) {
      addToast(err?.response?.data?.message || 'No se pudo iniciar el intento.', 'error');
    }
  };

  const toggleOption = (questionId, optionId, questionType) => {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (questionType === 'MULTIPLE_CHOICE') {
        const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId];
        return { ...prev, [questionId]: next };
      }
      return { ...prev, [questionId]: [optionId] };
    });
  };

  const handleSubmit = async () => {
    const payload = Object.entries(answers).map(([question_id, selected_option_ids]) => ({
      question_id,
      selected_option_ids,
    }));
    if (payload.length < quiz.questions.length) {
      addToast('Responde todas las preguntas antes de enviar.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const r = await lmsService.enviarIntento(attempt.id, payload);
      setResult(r);
      if (r.passed) {
        addToast('¡Aprobaste el cuestionario!', 'success');
        onCompleted?.();
      } else {
        addToast(`No alcanzaste el puntaje mínimo (obtuviste ${r.score}%).`, 'error');
      }
    } catch (err) {
      addToast(err?.response?.data?.message || 'No se pudo enviar el cuestionario.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="lms-quiz-loading">Cargando cuestionario…</p>;
  if (!quiz) return null;

  if (!quiz.can_attempt && !attempt) {
    return <p className="lms-quiz-blocked">Ya usaste todos tus intentos ({quiz.attempts_used}/{quiz.max_attempts}) para este cuestionario.</p>;
  }

  if (!attempt) {
    return (
      <div className="lms-quiz-intro">
        <h3>{quiz.titulo}</h3>
        <ul className="lms-quiz-meta">
          <li>{quiz.questions.length} preguntas</li>
          <li>Puntaje mínimo para aprobar: {quiz.passing_score}%</li>
          {quiz.max_attempts && <li>Intentos: {quiz.attempts_used}/{quiz.max_attempts}</li>}
          {quiz.time_limit_seconds && <li>Tiempo límite: {Math.round(quiz.time_limit_seconds / 60)} min</li>}
        </ul>
        <button className="lms-btn-primary" onClick={startAttempt}>Comenzar</button>
      </div>
    );
  }

  if (result) {
    return (
      <div className={`lms-quiz-result ${result.passed ? 'is-pass' : 'is-fail'}`}>
        <h3>{result.passed ? 'Aprobado' : 'No aprobado'}</h3>
        <p className="lms-quiz-score">{result.score}%</p>
        <ul className="lms-quiz-detail-list">
          {quiz.questions.map((q, i) => {
            const d = result.details.find((x) => x.question_id === q.id);
            return (
              <li key={q.id} className={d?.correct ? 'is-correct' : 'is-incorrect'}>
                <i className={`fa-solid ${d?.correct ? 'fa-check' : 'fa-xmark'}`} />
                Pregunta {i + 1}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="lms-quiz-runner">
      {secondsLeft != null && (
        <p className={`lms-quiz-timer ${secondsLeft < 30 ? 'is-urgent' : ''}`}>
          Tiempo restante: {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
        </p>
      )}
      {quiz.questions.map((q, i) => (
        <fieldset key={q.id} className="lms-quiz-question">
          <legend>{i + 1}. {q.enunciado}</legend>
          {q.options.map((opt) => (
            <label key={opt.id} className="lms-quiz-option">
              <input
                type={q.question_type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                name={q.id}
                checked={(answers[q.id] || []).includes(opt.id)}
                onChange={() => toggleOption(q.id, opt.id, q.question_type)}
              />
              <span>{opt.texto}</span>
            </label>
          ))}
        </fieldset>
      ))}
      <button className="lms-btn-primary" onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Enviando…' : 'Enviar respuestas'}
      </button>
    </div>
  );
};

export default QuizRunner;
