using FluentValidation;
using FluentValidation.Results;

namespace KbRag.Api.Filters;

/// <summary>
/// Endpoint filter that validates request using FluentValidation.
/// </summary>
public class ValidationFilter<T> : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var validator = context.HttpContext.RequestServices.GetService<IValidator<T>>();
        
        if (validator is null)
            return await next(context);

        var argument = context.Arguments.OfType<T>().FirstOrDefault();
        
        if (argument is null)
            return await next(context);

        var validationResult = await validator.ValidateAsync(argument);
        
        if (!validationResult.IsValid)
            return ToValidationProblem(validationResult);

        return await next(context);
    }

    private static IResult ToValidationProblem(ValidationResult result)
    {
        var errors = result.Errors
            .GroupBy(e => e.PropertyName ?? string.Empty)
            .ToDictionary(
                g => g.Key,
                g => g.Select(e => e.ErrorMessage).ToArray());

        return Results.ValidationProblem(errors);
    }
}
